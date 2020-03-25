<?php

namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * Form type for editing user email settings.
 */
class UserEmailSettingsType extends AbstractType
{
  /**
   * Build the form.
   *
   * @param FormBuilderInterface $builder
   * @param array $options
   */
  public function buildForm(FormBuilderInterface $builder, array $options)
  {
    $builder
      ->add('email', null, [
        'label' => 'Email Address'
      ])
      ->add('receivingEmails', ChoiceType::class, [
        'label' => 'Email Preferences',
        'choices' => [
          'Keep me informed about updates to the Turtle System by email' => true,
          'Don\'t email me about updates to the Turtle System' => false
        ]
      ]);
  }

  /**
   * Configure the form options.
   *
   * @param OptionsResolver $resolver
   */
  public function configureOptions(OptionsResolver $resolver)
  {
    $resolver->setDefaults([
      'data_class' => User::class
    ]);
  }
}
