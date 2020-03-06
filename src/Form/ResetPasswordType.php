<?php

namespace App\Form;

use App\Model\ResetPassword;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * Form type for reseting a password.
 */
class ResetPasswordType extends AbstractType
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
      ->add('password', RepeatedType::class, [
        'type' => PasswordType::class,
        'invalid_message' => 'The new password fields must match.',
        'first_options'  => ['label' => 'New password'],
        'second_options' => ['label' => 'Repeat new password']
      ]);
  }

  /**
   * Configure the form options.
   *
   * @param OptionsResolver $resolver
   */
  public function configureOptions(OptionsResolver $resolver)
  {
    $resolver->setDefaults(['data_class' => ResetPassword::class]);
  }
}
