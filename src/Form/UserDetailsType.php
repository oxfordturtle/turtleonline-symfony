<?php

namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * Form type for editing user details.
 */
class UserDetailsType extends AbstractType
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
      ->add('username', null, [
        'label' => 'Username (choose any)'
      ])
      ->add('firstname')
      ->add('surname')
      ->add('over13', ChoiceType::class, [
        'label' => 'Account Type',
        'choices' => [
          'This account is for me, and I am at least 13 years old' => true,
          'This account is for a child under 13, and I am their legal guardian' => false
        ]
      ])
      ->add('guardianFullname', null, [
        'label' => 'Full name of parent/guardian',
        'required' => false
      ])
      ->add('schoolName', null, [
        'label' => 'School Name (optional)',
        'required' => false
      ])
      ->add('schoolPostcode', null, [
        'label' => 'School Postcode (optional)',
        'required' => false
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
